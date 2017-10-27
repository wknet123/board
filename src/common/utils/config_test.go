package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSetConfig(t *testing.T) {
	assert := assert.New(t)
	AddValue("URL", "test.inspursoft.com")
	SetConfig("TEST_URL", "https://%s", "URL")
	testURL := GetConfig("TEST_URL")
	assert.Equal("https://test.inspursoft.com", testURL(), "TestURLs are not equal.")
}

func TestSetDefaultConfig(t *testing.T) {
	assert := assert.New(t)
	value := GetConfig("TEST_VALUE", "12345")
	assert.Equal("12345", value(), "Values get from config are not equal.")
}

func init() {
	Initialize()
}