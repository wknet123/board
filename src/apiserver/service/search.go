package service

import (
	"fmt"
	"git/inspursoft/board/src/common/dao"
	"git/inspursoft/board/src/common/model"
	"os"
	"strings"
)

type OriginImage struct {
	Repositories []string `json:"repositories"`
}

type SearchResult struct {
	ProjectResult []dao.SearchProjectResult `json:"project_result"`
	UserResult    []dao.SearchUserResult    `json:"user_result"`
	ImageResult   []SearchImageResult                 `json:"images_name"`
}
type SearchImageResult struct {
	ImageName   string `json:"image_name"`
	ProjectName string `json:"project_name"`
}

var RegistryIp = fmt.Sprintf("http://%s:%s/v2/_catalog", os.Getenv("REGISTRY_HOST"), os.Getenv("REGISTRY_PORT"))

func SearchSource(user *model.User, searchPara string) (searchResult SearchResult, err error) {
	var (
		resProject []dao.SearchProjectResult
		resUser    []dao.SearchUserResult
		resImages  []SearchImageResult
	)
	if user == nil {
		resProject, err = dao.SearchPublicProject(searchPara)
		searchResult.ProjectResult = resProject
	} else {
		currentProject, err := getProjectByUser(user.ID)
		if err != nil {
			return searchResult, err
		}
		resProject, err = dao.SearchPrivateProject(searchPara, user.Username)
		if err != nil {
			return searchResult, err
		}
		resUser, err = dao.SearchUser(user.Username, searchPara)
		if err != nil {
			return searchResult, err
		}
		resImages, err = searchImages(RegistryIp, currentProject, searchPara)
		if err != nil {
			return searchResult, err
		}
		searchResult = SearchResult{
			ProjectResult: resProject,
			UserResult:    resUser,
			ImageResult:   resImages,
		}
	}
	return searchResult, nil
}
func searchImages(url string, projectNames []string, para string) (res []SearchImageResult, err error) {
	var oriImg OriginImage
	err = getFromRequest(url, &oriImg)
	if err != nil {
		return
	}
	for _, v := range oriImg.Repositories {
		temp := strings.Split(v, "/")
		if len(temp) == 0 {
			continue
		}
		for _, projectNameVal := range projectNames {
			if strings.EqualFold(temp[0], projectNameVal) {
				nameStr := strings.Join(temp[1:], "/")
				projectName := temp[0]
				if strings.Contains(nameStr, para) {
					res = append(res, SearchImageResult{
						ImageName:   nameStr,
						ProjectName: projectName})
				}
			}
		}

	}
	return
}

func getProjectByUser(userID int64) (projectName []string, err error) {
	var query model.Project
	projects, err := GetProjectsByUser(query, userID)
	if err != nil {
		return
	}
	for _, v := range projects {
		projectName = append(projectName, v.Name)
	}
	return
}
