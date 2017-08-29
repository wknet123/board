package collect

import (
	"git/inspursoft/board/src/collector/model/collect"
	"git/inspursoft/board/src/collector/model/collect/dashboard"
	"git/inspursoft/board/src/collector/dao"
	modelK8s "k8s.io/client-go/pkg/api/v1"
)

func getPods(resource *SourceMap, podItems []modelK8s.Pod) []modelK8s.Pod {
	i := 0
	n_containers := 0
	for _, v := range podItems {
		var x = resource.pods
		i = i + 1
		x.PodHostIP = v.Status.HostIP
		x.PodName = v.Name
		x.CreateTime = v.CreationTimestamp.Format("2006-01-02 15:04:05")
		x.TimeListId = (*serviceDashboardID)[*minuteCounterI]
		tem_containers := len(v.Status.Conditions)
		n_containers = tem_containers + n_containers
		resource.maps.PodContainerCount[v.Name] = int64(tem_containers)
		for k, v := range v.Labels {
			var kvMap collect.PodKvMap
			kvMap.Name = k
			kvMap.Value = v
			kvMap.Belong = x.PodName
			kvMap.TimeListId = (*serviceDashboardID)[*minuteCounterI]
			var timeID dashboard.TimeListLog
			dao.QuerDbMax(&timeID)
			kvMap.TimeListId = timeID.Id + 1
			resource.maps.PodMap = append(resource.maps.PodMap, kvMap)
			dao.InsertDb(&kvMap)
		}
		dao.InsertDb(&x)
	}
	return podItem
}

func minuteCalc() (tempStruct []dashboard.ServiceDashboardSecond) {
	var temp []dashboard.ServiceDashboardSecond
	dao.QuerDb(&tempStruct, "service_dashboard_second", true, "time_list_id",
		serviceDashboardID[11], )
	for id := range serviceDashboardID {
		dao.QuerDb(&temp, "service_dashboard_second", true, "time_list_id",
			id, )
		for k, v := range temp {
			if tempStruct[k].ServiceName == v.ServiceName {
				tempStruct[k].PodNumber = (tempStruct[k].PodNumber + v.PodNumber) / 2
				tempStruct[k].ContainerNumber = (tempStruct[k].ContainerNumber + v.ContainerNumber) / 2
			}
		}

	}
	return
}

func hourCalc() (tempStruct []dashboard.ServiceDashboardMinute) {
	var temp []dashboard.ServiceDashboardMinute
	dao.QuerDb(&tempStruct, "service_dashboard_minute", true, "time_list_id",
		minuteServiceDashboardID[59], )
	for id := range minuteServiceDashboardID {
		dao.QuerDb(&temp, "service_dashboard_minute", true, "time_list_id",
			id, )
		for k, v := range temp {
			if tempStruct[k].ServiceName == v.ServiceName {
				tempStruct[k].PodNumber = (tempStruct[k].PodNumber + v.PodNumber) / 2
				tempStruct[k].ContainerNumber = (tempStruct[k].ContainerNumber + v.ContainerNumber) / 2
			}
		}

	}
	return
}
func dayCalc() (tempStruct []dashboard.ServiceDashboardHour) {
	var temp []dashboard.ServiceDashboardHour
	dao.QuerDb(&tempStruct, "service_dashboard_hour", true, "time_list_id",
		hourServiceDashboardID[23], )
	for id := range hourServiceDashboardID {
		dao.QuerDb(&temp, "service_dashboard_hour", true, "time_list_id",
			id, )
		for k, v := range temp {
			if tempStruct[k].ServiceName == v.ServiceName {
				tempStruct[k].PodNumber = (tempStruct[k].PodNumber + v.PodNumber) / 2
				tempStruct[k].ContainerNumber = (tempStruct[k].ContainerNumber + v.ContainerNumber) / 2
			}
		}

	}
	return
}